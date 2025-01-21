'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ClipboardList, DollarSign, Scale, Calendar, Plus, FolderPlus, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Goal } from '@/types/models';

interface GoalDetailViewProps {
  goal: Goal;
  onUpdate: (updatedGoal: Goal) => void;
}

interface StepTask {
  id: string;
  text: string;
  status: 'pending' | 'completed' | 'cancelled';
  isNew?: boolean;
}

const FlipTask = ({ task, onComplete, isNew }: { 
  task: StepTask; 
  onComplete: () => void;
  isNew?: boolean;
}) => {
  return (
    <div className={cn(
      "flex items-center space-x-2 ml-6 transform-gpu",
      isNew && "animate-flip-in origin-top"
    )}>
      <Checkbox
        checked={task.status === 'completed'}
        onCheckedChange={onComplete}
      />
      <span className={task.status === 'completed' ? 'text-muted-foreground line-through' : ''}>
        {task.text}
      </span>
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

  const handleTaskCompletion = (stepId: string, taskId: string) => {
    const updatedSteps = goal.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          tasks: step.tasks.map(task => 
            task.id === taskId 
              ? { ...task, status: task.status === 'completed' ? ('pending' as const) : ('completed' as const) }
              : task
          )
        };
      }
      return step;
    });

    onUpdate({ ...goal, steps: updatedSteps });
  };

  const addTask = (stepId: string) => {
    if (!newTaskText[stepId]) return;
    
    const updatedSteps = goal.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          tasks: [...step.tasks, {
            id: crypto.randomUUID(),
            text: newTaskText[stepId],
            status: 'pending' as const,
            isNew: true
          }]
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
            <Calendar className="w-4 h-4 mr-2" />
            <span>Due: {goal.targetDate?.toLocaleDateString()}</span>
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
                    {step.tasks.map(task => (
                      <FlipTask
                        key={task.id}
                        task={task}
                        onComplete={() => handleTaskCompletion(step.id, task.id)}
                        isNew={task.isNew}
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