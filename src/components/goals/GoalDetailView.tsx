'use client';

import { useState } from 'react';
import { Goal, Step } from '@/types/models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Target, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoalDetailViewProps {
  goal: Goal;
  onUpdate: (updatedGoal: Goal) => void;
}

const GoalDetailView = ({ goal, onUpdate }: GoalDetailViewProps) => {
  const [localGoal, setLocalGoal] = useState(goal);

  const calculateProgress = () => {
    const totalSteps = localGoal.steps.length;
    const completedSteps = localGoal.steps.filter(step => 
      step.tasks.every(task => task.completed)
    ).length;

    return Math.round((completedSteps / totalSteps) * 100);
  };

  const toggleStepCompletion = (stepId: string) => {
    const updatedSteps = localGoal.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          tasks: step.tasks.map(task => ({
            ...task,
            completed: !task.completed
          }))
        };
      }
      return step;
    });

    const updatedGoal = { ...localGoal, steps: updatedSteps };
    setLocalGoal(updatedGoal);
    onUpdate(updatedGoal);
  };

  const toggleTaskCompletion = (stepId: string, taskId: string) => {
    const updatedSteps = localGoal.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          tasks: step.tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        };
      }
      return step;
    });

    const updatedGoal = { ...localGoal, steps: updatedSteps };
    setLocalGoal(updatedGoal);
    onUpdate(updatedGoal);
  };

  const addTaskToStep = (stepId: string, taskText: string) => {
    const updatedSteps = localGoal.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          tasks: [
            ...step.tasks,
            {
              id: Math.random().toString(36).substr(2, 9),
              text: taskText,
              completed: false
            }
          ]
        };
      }
      return step;
    });

    const updatedGoal = { ...localGoal, steps: updatedSteps };
    setLocalGoal(updatedGoal);
    onUpdate(updatedGoal);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{localGoal.name}</h1>
          <div className="flex items-center mt-2 text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Due: {localGoal.targetDate?.toLocaleDateString() || 'No target date'}</span>
          </div>
        </div>
        <Button variant="default">
          Edit Goal
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Progress value={calculateProgress()} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>{calculateProgress()}% Complete</span>
              <span>{localGoal.steps.length} Steps</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps and Tasks */}
      <div className="grid gap-4">
        {localGoal.steps.map((step) => (
          <Card key={step.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={step.tasks.every(task => task.completed)}
                    onCheckedChange={() => toggleStepCompletion(step.id)}
                    className="mt-1"
                  />
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <List className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">
                      {step.text}
                    </h3>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    {step.tasks.map(task => (
                      <div key={task.id} className="flex items-center space-x-2 ml-6">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTaskCompletion(step.id, task.id)}
                        />
                        <span className={task.completed ? 'text-gray-500 line-through' : ''}>
                          {task.text}
                        </span>
                      </div>
                    ))}
                    <button 
                      className="flex items-center text-blue-500 hover:text-blue-600 ml-6 mt-2"
                      onClick={() => {
                        const taskText = prompt('Enter new task:');
                        if (taskText) {
                          addTaskToStep(step.id, taskText);
                        }
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Task
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GoalDetailView;