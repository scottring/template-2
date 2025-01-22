'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, DollarSign, Scale, Plus, FolderPlus, Pencil, 
  Calendar as CalendarIcon, Loader2, AlertCircle, Trash 
} from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { Goal, StepTask, GoalType } from '@/types/models';

interface GoalDetailViewProps {
  goal: Goal;
  onUpdate: (updatedGoal: Goal) => void;
  disabled?: boolean;
}

export default function GoalDetailView({ goal, onUpdate, disabled = false }: GoalDetailViewProps) {
  const [newTaskText, setNewTaskText] = useState<{ [key: string]: string }>({});
  const [newStepText, setNewStepText] = useState('');
  const [showNewStep, setShowNewStep] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const taskRefs = useRef<{ [key: string]: HTMLDivElement }>({});

  if (!goal) {
    return <div>Loading goal details...</div>;
  }

  const calculateProgress = () => {
    const totalTasks = goal.steps.reduce((acc: number, step) => 
      acc + (step.tasks?.length || 0), 0
    );
    const completedTasks = goal.steps.reduce((acc: number, step) => 
      acc + (step.tasks?.filter(t => t.status === 'completed').length || 0), 0
    );
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const focusTask = (stepId: string, taskId: string) => {
    taskRefs.current[`${stepId}-${taskId}`]?.focus();
  };

  const handleTaskKeyDown = (e: React.KeyboardEvent, stepId: string, taskId: string, taskIndex: number, tasks: StepTask[]) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTaskStatusChange(stepId, taskId, tasks[taskIndex].status !== 'completed');
    } else if (e.key === 'ArrowDown' && taskIndex < tasks.length - 1) {
      e.preventDefault();
      focusTask(stepId, tasks[taskIndex + 1].id);
    } else if (e.key === 'ArrowUp' && taskIndex > 0) {
      e.preventDefault();
      focusTask(stepId, tasks[taskIndex - 1].id);
    }
  };

  const handleDeleteTask = (stepId: string, taskId: string) => {
    const updatedGoal: Goal = {
      ...goal,
      steps: goal.steps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            tasks: step.tasks.filter(task => task.id !== taskId)
          };
        }
        return step;
      })
    };
    onUpdate(updatedGoal);
  };

  const handleTaskStatusChange = (stepId: string, taskId: string, completed: boolean) => {
    const updatedGoal: Goal = {
      ...goal,
      steps: goal.steps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            tasks: step.tasks.map(task => {
              if (task.id === taskId) {
                return {
                  ...task,
                  status: completed ? 'completed' as const : 'pending' as const
                };
              }
              return task;
            })
          };
        }
        return step;
      })
    };
    onUpdate(updatedGoal);
  };

  const handleAddTask = async (stepId: string) => {
    if (!newTaskText[stepId]?.trim()) return null;

    const newTask = {
      id: crypto.randomUUID(),
      text: newTaskText[stepId],
      status: 'pending' as const
    };

    const updatedGoal: Goal = {
      ...goal,
      steps: goal.steps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            tasks: [...step.tasks, newTask]
          };
        }
        return step;
      })
    };

    await onUpdate(updatedGoal);
    setNewTaskText(prev => ({ ...prev, [stepId]: '' }));
    return newTask;
  };

  const handleAddStep = () => {
    if (!newStepText.trim()) return;

    const updatedGoal: Goal = {
      ...goal,
      steps: [
        ...goal.steps,
        {
          id: crypto.randomUUID(),
          text: newStepText,
          stepType: 'Project' as GoalType,
          isTracked: true,
          tasks: [],
          notes: []
        }
      ]
    };
    onUpdate(updatedGoal);
    setNewStepText('');
    setShowNewStep(false);
  };

  return (
    <>
      <button 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-background focus:rounded-lg focus:shadow-lg"
        onClick={() => {
          const firstTask = document.querySelector('[role="listitem"]');
          (firstTask as HTMLElement)?.focus();
        }}
      >
        Skip to tasks
      </button>
      <div id="datepicker-portal" />
      <div className="max-w-4xl mx-auto space-y-6 relative">
        {disabled && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="flex items-center gap-2 bg-background p-4 rounded-lg shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving changes...</span>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{goal.name}</h1>
            <div className="flex items-center mt-2 text-muted-foreground">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span>Due: {goal.targetDate && isValid(new Date(goal.targetDate)) ? format(new Date(goal.targetDate), 'MMM d, yyyy') : 'No due date set'}</span>
            </div>
          </div>
          <button
            aria-label={isEditMode ? 'Cancel editing goal' : 'Edit goal'}
            className={cn(
              "px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center",
              isEditMode 
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground"
            )}
            onClick={() => setIsEditMode(!isEditMode)}
            disabled={disabled}
          >
            {disabled ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Pencil className="w-4 h-4 mr-2" />
            )}
            {isEditMode ? 'Cancel Edit' : 'Edit Goal'}
          </button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Progress</h3>
                <span 
                  className="text-sm text-muted-foreground"
                  aria-live="polite"
                  role="status"
                >
                  {calculateProgress()}%
                </span>
              </div>
              <Progress 
                value={calculateProgress()} 
                className="h-2"
                aria-label={`Goal progress: ${calculateProgress()}%`}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {goal.steps.map((step) => (
            <Card key={step.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{step.text}</h3>
                    <span className="text-sm text-muted-foreground">{step.stepType}</span>
                  </div>

                  <div 
                    className="space-y-2"
                    role="list"
                    aria-label={`Tasks for step: ${step.text}`}
                  >
                    <div className="sr-only">
                      Use arrow keys to navigate between tasks, Enter or Space to toggle completion
                    </div>
                    {step.tasks
                      .slice()
                      .sort((a, b) => {
                        // Sort by due date (overdue first, then upcoming)
                        if (!a.dueDate && !b.dueDate) return 0;
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                      })
                      .map((task, taskIndex) => (
                      <div 
                        key={task.id} 
                        className="flex items-center space-x-2"
                        role="listitem"
                        tabIndex={0}
                        ref={el => {
                          if (el) taskRefs.current[`${step.id}-${task.id}`] = el;
                        }}
                        onKeyDown={(e) => handleTaskKeyDown(e, step.id, task.id, taskIndex, step.tasks)}
                      >
                        <Checkbox
                          checked={task.status === 'completed'}
                          disabled={disabled}
                          aria-label={`Mark task "${task.text}" as ${task.status === 'completed' ? 'incomplete' : 'complete'}`}
                          onCheckedChange={(checked) => 
                            handleTaskStatusChange(step.id, task.id, checked as boolean)
                          }
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span 
                              className={cn(
                                "py-2",
                                task.status === 'completed' && "line-through text-muted-foreground",
                                task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed' && "text-destructive"
                              )}
                              role="presentation"
                            >
                              {task.text}
                            </span>
                            {task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertCircle 
                                      className="h-4 w-4 text-destructive cursor-help" 
                                      aria-label="Task is overdue"
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Task was due on {format(new Date(task.dueDate), 'MMMM d')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "ml-2",
                                    task.dueDate && "text-primary"
                                  )}
                                  disabled={disabled}
                                  aria-label={task.dueDate 
                                    ? `Due date: ${format(new Date(task.dueDate), 'MMMM d')}. Press Alt+D to change, Alt+C to clear`
                                    : "Set due date. Press Alt+D to open calendar"}
                                  onKeyDown={(e) => {
                                    if (e.altKey && e.key === 'd') {
                                      e.preventDefault();
                                      (e.currentTarget as HTMLButtonElement).click();
                                    } else if (e.altKey && e.key === 'c' && task.dueDate) {
                                      e.preventDefault();
                                      const updatedGoal: Goal = {
                                        ...goal,
                                        steps: goal.steps.map(s => {
                                          if (s.id === step.id) {
                                            return {
                                              ...s,
                                              tasks: s.tasks.map(t => {
                                                if (t.id === task.id) {
                                                  return {
                                                    ...t,
                                                    dueDate: undefined
                                                  };
                                                }
                                                return t;
                                              })
                                            };
                                          }
                                          return s;
                                        })
                                      };
                                      onUpdate(updatedGoal);
                                    }
                                  }}
                                >
                                  <CalendarIcon className="h-4 w-4" />
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="ml-2 text-sm">
                                          {task.dueDate && format(new Date(task.dueDate), 'MMM d')}
                                        </span>
                                      </TooltipTrigger>
                                      {task.dueDate && (
                                        <TooltipContent>
                                          <p>{format(new Date(task.dueDate), 'MMMM d, yyyy')}</p>
                                        </TooltipContent>
                                      )}
                                    </Tooltip>
                                  </TooltipProvider>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                <div className="p-2 space-y-2">
                                  <div className="text-sm text-muted-foreground">
                                    Press Escape to close
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                      const today = new Date();
                                      const updatedGoal: Goal = {
                                        ...goal,
                                        steps: goal.steps.map(s => {
                                          if (s.id === step.id) {
                                            return {
                                              ...s,
                                              tasks: s.tasks.map(t => {
                                                if (t.id === task.id) {
                                                  return {
                                                    ...t,
                                                    dueDate: today
                                                  };
                                                }
                                                return t;
                                              })
                                            };
                                          }
                                          return s;
                                        })
                                      };
                                      onUpdate(updatedGoal);
                                    }}
                                  >
                                    Set to Today
                                  </Button>
                                </div>
                                <Calendar
                                  mode="single"
                                  selected={task.dueDate ? new Date(task.dueDate) : undefined}
                                  onSelect={(date) => {
                                    const updatedGoal: Goal = {
                                      ...goal,
                                      steps: goal.steps.map(s => {
                                        if (s.id === step.id) {
                                          return {
                                            ...s,
                                            tasks: s.tasks.map(t => {
                                              if (t.id === task.id) {
                                                return {
                                                  ...t,
                                                  dueDate: date
                                                };
                                              }
                                              return t;
                                            })
                                          };
                                        }
                                        return s;
                                      })
                                    };
                                    onUpdate(updatedGoal);
                                    // Announce the date change to screen readers
                                    const announcement = date 
                                      ? `Due date set to ${format(date, 'MMMM d')}`
                                      : 'Due date cleared';
                                    const live = document.createElement('div');
                                    live.setAttribute('aria-live', 'polite');
                                    live.textContent = announcement;
                                    document.body.appendChild(live);
                                    setTimeout(() => document.body.removeChild(live), 1000);
                                  }}
                                  disabled={disabled}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteTask(step.id, task.id)}
                              disabled={disabled}
                              aria-label={`Delete task: ${task.text}`}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <Input
                      placeholder="Add a task..."
                      value={newTaskText[step.id] || ''}
                      disabled={disabled}
                      aria-label={`Add task to step: ${step.text}`}
                      onChange={(e) => setNewTaskText(prev => ({
                        ...prev,
                        [step.id]: e.target.value
                      }))}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter' && !disabled) {
                          e.preventDefault();
                          const newTask = await handleAddTask(step.id);
                          if (newTask) {
                            // Focus the newly added task after a brief delay to allow for DOM update
                            setTimeout(() => focusTask(step.id, newTask.id), 100);
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddTask(step.id)}
                      disabled={disabled}
                    >
                      {disabled ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {showNewStep && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Input
                  placeholder="Enter step description..."
                  value={newStepText}
                  disabled={disabled}
                  aria-label="Enter new step description"
                  onChange={(e) => setNewStepText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !disabled) {
                      e.preventDefault();
                      handleAddStep();
                    } else if (e.key === 'Escape') {
                      setShowNewStep(false);
                      setNewStepText('');
                    }
                  }}
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewStep(false);
                      setNewStepText('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddStep}
                    disabled={disabled}
                  >
                    {disabled ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Add Step'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
