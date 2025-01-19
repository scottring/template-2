import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, addMonths } from 'date-fns';
import { ArrowRight, ArrowLeft, CalendarIcon, Target, ListTodo, Repeat, Sparkles, Loader2, FolderIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { GoalType, Area } from '@/types/models';
import useAreaStore from '@/lib/stores/useAreaStore';

interface Step {
  text: string;
  stepType: GoalType;
  frequency?: number;
  frequencyType?: 'week' | 'month' | 'quarter' | 'year';
  targetDate?: Date;
  notes?: string;
  tasks: { text: string; isCompleted: boolean }[];
}

interface GoalData {
  name: string;
  description: string;
  targetDate: Date;
  goalType: GoalType;
  areaId: string;
  steps: Step[];
}

interface FlowCreatorProps {
  onComplete: (data: GoalData) => void;
  onCancel: () => void;
}

// Custom input component for the date picker
const CustomDatePickerInput = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
  ({ value, onClick }, ref) => (
    <Button
      variant="outline"
      className="w-full justify-start text-left font-normal"
      onClick={onClick}
      ref={ref}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {value}
    </Button>
  )
);
CustomDatePickerInput.displayName = 'CustomDatePickerInput';

export function FlowCreator({ onComplete, onCancel }: FlowCreatorProps) {
  const areas = useAreaStore(state => state.areas);
  const [step, setStep] = useState<'intro' | 'input-method' | 'ai-input' | 'manual-input' | 'review'>('intro');
  const [direction, setDirection] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [data, setData] = useState<GoalData>({
    name: '',
    description: '',
    targetDate: addMonths(new Date(), 1),
    goalType: 'Tangible',
    areaId: '',
    steps: []
  });
  const [error, setError] = useState<string | null>(null);

  const goToNext = () => {
    setError(null);
    const steps: Array<'intro' | 'input-method' | 'ai-input' | 'manual-input' | 'review'> = 
      ['intro', 'input-method', 'ai-input', 'manual-input', 'review'];
    const currentIndex = steps.indexOf(step);
    
    if (currentIndex < steps.length - 1) {
      setDirection(1);
      setStep(steps[currentIndex + 1]);
    }
  };

  const goToPrevious = () => {
    const steps: Array<'intro' | 'input-method' | 'ai-input' | 'manual-input' | 'review'> = 
      ['intro', 'input-method', 'ai-input', 'manual-input', 'review'];
    const currentIndex = steps.indexOf(step);
    
    if (currentIndex > 0) {
      setDirection(-1);
      setStep(steps[currentIndex - 1]);
    }
  };

  const processAiInput = async () => {
    if (!aiPrompt.trim()) {
      setError('Please enter your goal description');
      return;
    }

    if (!areas || areas.length === 0) {
      setError('No areas available. Please create an area first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Log what we're sending
      console.log('Sending request with:', {
        prompt: aiPrompt,
        areas: areas
      });

      const response = await fetch('/api/ai/parse-goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          areas: areas.map(area => ({
            id: area.id,
            name: area.name,
            description: area.description || ''
          }))
        }),
      });

      const result = await response.json();
      console.log('Received result:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process goal');
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      // Convert ISO date strings back to Date objects
      const processedResult = {
        ...result,
        targetDate: new Date(result.targetDate),
        steps: result.steps.map((step: Step) => ({
          ...step,
          targetDate: step.targetDate ? new Date(step.targetDate) : undefined
        }))
      };

      setData(processedResult);
      setStep('review');
    } catch (err) {
      console.error('Error processing goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to process your input. Please try again or use manual input.');
    } finally {
      setIsProcessing(false);
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
                  Create a New Goal
                </motion.h1>
                <motion.p 
                  className="text-xl text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Let's break down your goal into actionable steps
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button 
                    size="lg"
                    onClick={() => {
                      setDirection(1);
                      setStep('input-method');
                    }}
                    className="mt-8"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          )}

          {step === 'input-method' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">How would you like to create your goal?</h2>
                <p className="text-xl text-muted-foreground">
                  Choose your preferred method
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
                <Card 
                  className="p-6 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    setDirection(1);
                    setStep('ai-input');
                  }}
                >
                  <div className="space-y-4 text-center">
                    <Sparkles className="h-12 w-12 mx-auto text-primary" />
                    <h3 className="text-xl font-semibold">AI Assistant</h3>
                    <p className="text-muted-foreground">
                      Describe your goal in natural language and let AI help structure it
                    </p>
                  </div>
                </Card>

                <Card 
                  className="p-6 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    setDirection(1);
                    setStep('manual-input');
                  }}
                >
                  <div className="space-y-4 text-center">
                    <ListTodo className="h-12 w-12 mx-auto text-primary" />
                    <h3 className="text-xl font-semibold">Manual Input</h3>
                    <p className="text-muted-foreground">
                      Create your goal step by step with full control
                    </p>
                  </div>
                </Card>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={goToPrevious}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>
            </div>
          )}

          {step === 'ai-input' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Describe Your Goal</h2>
                <p className="text-xl text-muted-foreground">
                  Tell me about your goal in natural language
                </p>
              </div>

              <Card className="p-6 max-w-3xl mx-auto">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Example: I want to learn Spanish. My target is to be conversational in 6 months. I plan to practice daily, take weekly lessons, and use language apps..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="min-h-[200px] text-lg"
                    />
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Include details like timeframe, frequency of activities, and specific milestones you want to achieve
                    </p>
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
                      onClick={processAiInput}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing
                        </>
                      ) : (
                        <>
                          Process with AI
                          <Sparkles className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === 'manual-input' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Create Your Goal</h2>
                <p className="text-xl text-muted-foreground">
                  Enter your goal details
                </p>
              </div>

              <Card className="p-6">
                <div className="space-y-4">
                  <Input
                    placeholder="Enter your goal name..."
                    value={data.name}
                    onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                    className="text-lg"
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter your goal description..."
                    value={data.description}
                    onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[150px] text-lg"
                  />
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-4">
                  <Select
                    value={data.areaId}
                    onValueChange={(value) => setData(prev => ({ ...prev, areaId: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-4 w-4" />
                        <SelectValue placeholder="Select an area" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: area.color }} />
                            {area.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {error && !data.areaId && (
                    <p className="text-sm text-destructive">Please select an area for your goal</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex justify-center">
                  <DatePicker
                    selected={data.targetDate}
                    onChange={(date) => date && setData(prev => ({ ...prev, targetDate: date }))}
                    customInput={<CustomDatePickerInput />}
                    dateFormat="PPP"
                    minDate={new Date()}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
              </Card>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Review Your Goal
                </h2>
                <p className="text-xl text-muted-foreground">
                  Review and edit your goal details
                </p>
              </div>

              <Card className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Goal Name</label>
                    <Input
                      value={data.name}
                      onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={data.description}
                      onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Area</label>
                    <Select
                      value={data.areaId}
                      onValueChange={(value) => setData(prev => ({ ...prev, areaId: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <div className="flex items-center gap-2">
                          <FolderIcon className="h-4 w-4" />
                          <SelectValue placeholder="Select an area" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: area.color }} />
                              {area.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Target Date</label>
                    <div className="mt-1">
                      <DatePicker
                        selected={data.targetDate}
                        onChange={(date) => date && setData(prev => ({ ...prev, targetDate: date }))}
                        customInput={<CustomDatePickerInput />}
                        dateFormat="PPP"
                        minDate={new Date()}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Steps</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setData(prev => ({
                        ...prev,
                        steps: [...prev.steps, {
                          text: '',
                          stepType: 'Tangible',
                          tasks: [],
                          targetDate: addMonths(new Date(), 1)
                        }]
                      }))}
                    >
                      Add Step
                    </Button>
                  </div>

                  {data.steps.map((step, index) => (
                    <Card key={index} className="p-4 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <Input
                            value={step.text}
                            onChange={(e) => {
                              const newSteps = [...data.steps];
                              newSteps[index] = { ...step, text: e.target.value };
                              setData(prev => ({ ...prev, steps: newSteps }));
                            }}
                            placeholder="Step description"
                          />

                          <div className="flex gap-4">
                            <Select
                              value={step.stepType}
                              onValueChange={(value: GoalType) => {
                                const newSteps = [...data.steps];
                                newSteps[index] = {
                                  ...step,
                                  stepType: value,
                                  // Reset frequency/targetDate when switching types
                                  frequency: value === 'Habit' ? 1 : undefined,
                                  frequencyType: value === 'Habit' ? 'week' : undefined,
                                  targetDate: value === 'Tangible' ? addMonths(new Date(), 1) : undefined
                                };
                                setData(prev => ({ ...prev, steps: newSteps }));
                              }}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Habit">Habit</SelectItem>
                                <SelectItem value="Tangible">Tangible</SelectItem>
                              </SelectContent>
                            </Select>

                            {step.stepType === 'Habit' && (
                              <>
                                <Input
                                  type="number"
                                  min="1"
                                  className="w-20"
                                  value={step.frequency}
                                  onChange={(e) => {
                                    const newSteps = [...data.steps];
                                    newSteps[index] = { ...step, frequency: parseInt(e.target.value) || 1 };
                                    setData(prev => ({ ...prev, steps: newSteps }));
                                  }}
                                />
                                <Select
                                  value={step.frequencyType || 'week'}
                                  onValueChange={(value: 'week' | 'month' | 'quarter' | 'year') => {
                                    const newSteps = [...data.steps];
                                    newSteps[index] = { ...step, frequencyType: value };
                                    setData(prev => ({ ...prev, steps: newSteps }));
                                  }}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="week">per week</SelectItem>
                                    <SelectItem value="month">per month</SelectItem>
                                    <SelectItem value="quarter">per quarter</SelectItem>
                                    <SelectItem value="year">per year</SelectItem>
                                  </SelectContent>
                                </Select>
                              </>
                            )}

                            {step.stepType === 'Tangible' && (
                              <DatePicker
                                selected={step.targetDate}
                                onChange={(date) => {
                                  if (date) {
                                    const newSteps = [...data.steps];
                                    newSteps[index] = { ...step, targetDate: date };
                                    setData(prev => ({ ...prev, steps: newSteps }));
                                  }
                                }}
                                customInput={
                                  <Button
                                    variant="outline"
                                    className="w-[180px] justify-start text-left font-normal"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {step.targetDate ? format(step.targetDate, 'PP') : 'Select date'}
                                  </Button>
                                }
                                dateFormat="PP"
                                minDate={new Date()}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                              />
                            )}
                          </div>

                          {step.notes && (
                            <Textarea
                              value={step.notes}
                              onChange={(e) => {
                                const newSteps = [...data.steps];
                                newSteps[index] = { ...step, notes: e.target.value };
                                setData(prev => ({ ...prev, steps: newSteps }));
                              }}
                              placeholder="Additional notes"
                              className="mt-2"
                            />
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Tasks</label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newSteps = [...data.steps];
                                  newSteps[index] = {
                                    ...step,
                                    tasks: [...step.tasks, { text: '', isCompleted: false }]
                                  };
                                  setData(prev => ({ ...prev, steps: newSteps }));
                                }}
                              >
                                Add Task
                              </Button>
                            </div>
                            {step.tasks.map((task, taskIndex) => (
                              <div key={taskIndex} className="flex items-center gap-2">
                                <Input
                                  value={task.text}
                                  onChange={(e) => {
                                    const newSteps = [...data.steps];
                                    newSteps[index] = {
                                      ...step,
                                      tasks: step.tasks.map((t, i) =>
                                        i === taskIndex ? { ...t, text: e.target.value } : t
                                      )
                                    };
                                    setData(prev => ({ ...prev, steps: newSteps }));
                                  }}
                                  placeholder="Task description"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newSteps = [...data.steps];
                                    newSteps[index] = {
                                      ...step,
                                      tasks: step.tasks.filter((_, i) => i !== taskIndex)
                                    };
                                    setData(prev => ({ ...prev, steps: newSteps }));
                                  }}
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newSteps = data.steps.filter((_, i) => i !== index);
                            setData(prev => ({ ...prev, steps: newSteps }));
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </Card>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step === 'intro' ? (
              <Button
                variant="ghost"
                onClick={onCancel}
              >
                Cancel
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={goToPrevious}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            
            {step === 'review' ? (
              <Button
                onClick={() => onComplete(data)}
                className="flex items-center gap-2"
              >
                Create Goal
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={goToNext}
                className="flex items-center gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 