'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  ArrowLeft,
  Calendar,
  MoreVertical,
  PlusIcon,
  Share2,
  Target,
  Trash2,
  Pencil,
  ArrowUpRight,
  Plus,
  Check,
  X,
} from "lucide-react";
import useGoalStore from "@/lib/stores/useGoalStore";
import { useProjectStore } from "@/lib/stores/useProjectStore";
import { Goal, Project, Step, GoalType } from "@/types/models";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ShareDialog } from "@/components/shared/ShareDialog";
import { SharedIndicator } from "@/components/shared/SharedIndicator";
import { TasksSection } from "@/components/goals/TasksSection";
import { Notepad } from "@/components/shared/Notepad";
import { EditGoalDialog } from "@/components/goals/EditGoalDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '../../../components/ui/date-picker';

type EditableGoal = {
  id: string;
  name: string;
  description: string;
  areaId: string;
  startDate: Date;
  targetDate?: Date;
  progress: number;
  goalType: GoalType;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  steps: Step[];
  assignedTo: string[];
  householdId: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
};

export default function GoalPage() {
  const params = useParams();
  const router = useRouter();
  const { goals, updateGoal } = useGoalStore();
  const { projects, setProjects } = useProjectStore();
  const goal = goals.find(g => g.id === params.id);
  const goalProjects = projects.filter((project: Project) => project.goalId === params.id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState<EditableGoal | undefined>(goal ? {
    id: goal.id,
    name: goal.name,
    description: goal.description,
    areaId: goal.areaId,
    startDate: goal.startDate,
    targetDate: goal.targetDate,
    progress: goal.progress,
    goalType: goal.goalType,
    status: goal.status,
    steps: goal.steps,
    assignedTo: goal.assignedTo,
    householdId: goal.householdId
  } : undefined);
  const [newStep, setNewStep] = useState<Partial<Step>>({
    id: '',
    text: '',
    stepType: 'Tangible',
    isTracked: true,
    tasks: []
  });

  if (!goal || !editedGoal) return null;

  const handleSave = () => {
    if (editedGoal) {
      const updatedGoal: Goal = {
        ...editedGoal,
        createdAt: goal.createdAt,
        updatedAt: new Date(),
        createdBy: goal.createdBy,
        updatedBy: goal.updatedBy
      };
      updateGoal(goal.id, updatedGoal);
      setIsEditing(false);
    }
  };

  const handleUpdateEditedGoal = (updates: Partial<EditableGoal>) => {
    if (editedGoal) {
      setEditedGoal({ ...editedGoal, ...updates });
    }
  };

  const handleAddStep = () => {
    if (newStep.text && editedGoal) {
      const step: Step = {
        ...newStep as Step,
        id: Math.random().toString(36).substr(2, 9),
        tasks: [],
        notes: []
      };
      handleUpdateEditedGoal({
        steps: [...editedGoal.steps, step]
      });
      setNewStep({
        id: '',
        text: '',
        stepType: 'Tangible',
        isTracked: true,
        tasks: []
      });
    }
  };

  const handleUpdateStep = (stepId: string, updates: Partial<Step>) => {
    if (editedGoal) {
      handleUpdateEditedGoal({
        steps: editedGoal.steps.map(step => 
          step.id === stepId ? { ...step, ...updates } : step
        )
      });
    }
  };

  const handleDeleteStep = (stepId: string) => {
    if (editedGoal) {
      handleUpdateEditedGoal({
        steps: editedGoal.steps.filter(step => step.id !== stepId)
      });
    }
  };

  const handleAddTask = (stepId: string, taskText: string) => {
    if (editedGoal) {
      handleUpdateEditedGoal({
        steps: editedGoal.steps.map(step => {
          if (step.id === stepId) {
            return {
              ...step,
              tasks: [...step.tasks, {
                id: Math.random().toString(36).substr(2, 9),
                text: taskText,
                completed: false
              }]
            };
          }
          return step;
        })
      });
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditedGoal({
                    id: goal.id,
                    name: goal.name,
                    description: goal.description,
                    areaId: goal.areaId,
                    startDate: goal.startDate,
                    targetDate: goal.targetDate,
                    progress: goal.progress,
                    goalType: goal.goalType,
                    status: goal.status,
                    steps: goal.steps,
                    assignedTo: goal.assignedTo,
                    householdId: goal.householdId
                  });
                  setIsEditing(false);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              Edit Goal
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            {isEditing ? (
              <Input
                value={editedGoal.name}
                onChange={(e) => handleUpdateEditedGoal({ name: e.target.value })}
                className="text-2xl font-bold"
              />
            ) : (
              <h1 className="text-2xl font-bold">{goal.name}</h1>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="outline">{goal.goalType}</Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                {isEditing ? (
                  <DatePicker
                    date={editedGoal.targetDate}
                    onChange={(date: Date | undefined) => handleUpdateEditedGoal({ targetDate: date })}
                  />
                ) : (
                  <span>Due {new Date(goal.targetDate || Date.now()).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-2">Description</h2>
            {isEditing ? (
              <Textarea
                value={editedGoal.description}
                onChange={(e) => handleUpdateEditedGoal({ description: e.target.value })}
                className="min-h-[100px]"
              />
            ) : (
              <p className="text-muted-foreground">{goal.description}</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Steps</h2>
            {isEditing && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add a new step..."
                  value={newStep.text}
                  onChange={(e) => setNewStep({ ...newStep, text: e.target.value })}
                  className="w-[300px]"
                />
                <DatePicker
                  date={newStep.startDateTime}
                  onChange={(date: Date | undefined) => setNewStep({ ...newStep, startDateTime: date })}
                  placeholder="Start date"
                />
                <DatePicker
                  date={newStep.endDateTime}
                  onChange={(date: Date | undefined) => setNewStep({ ...newStep, endDateTime: date })}
                  placeholder="End date"
                />
                <Button size="sm" onClick={handleAddStep}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {editedGoal.steps.map((step) => (
              <Card key={step.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {isEditing ? (
                        <>
                          <Input
                            value={step.text}
                            onChange={(e) => handleUpdateStep(step.id, { text: e.target.value })}
                          />
                          <div className="flex items-center gap-2">
                            <DatePicker
                              date={step.startDateTime}
                              onChange={(date: Date | undefined) => handleUpdateStep(step.id, { startDateTime: date })}
                              placeholder="Start date"
                            />
                            <DatePicker
                              date={step.endDateTime}
                              onChange={(date: Date | undefined) => handleUpdateStep(step.id, { endDateTime: date })}
                              placeholder="End date"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <p>{step.text}</p>
                          {(step.startDateTime || step.endDateTime) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {step.startDateTime && (
                                <span>Starts: {new Date(step.startDateTime).toLocaleDateString()}</span>
                              )}
                              {step.endDateTime && (
                                <span>Due: {new Date(step.endDateTime).toLocaleDateString()}</span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    {isEditing && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDeleteStep(step.id)}>
                            Delete Step
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Tasks</h4>
                    <div className="space-y-2">
                      {step.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(e) => {
                              handleUpdateStep(step.id, {
                                tasks: step.tasks.map(t =>
                                  t.id === task.id ? { ...t, completed: e.target.checked } : t
                                )
                              });
                            }}
                            className="rounded border-gray-300"
                          />
                          {isEditing ? (
                            <Input
                              value={task.text}
                              onChange={(e) => {
                                handleUpdateStep(step.id, {
                                  tasks: step.tasks.map(t =>
                                    t.id === task.id ? { ...t, text: e.target.value } : t
                                  )
                                });
                              }}
                            />
                          ) : (
                            <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                              {task.text}
                            </span>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            placeholder="Add a new task..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value) {
                                handleAddTask(step.id, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
