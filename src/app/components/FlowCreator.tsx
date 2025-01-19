import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { format, addMonths } from 'date-fns';
import { ArrowRight, ArrowLeft, CalendarIcon, Target, ListTodo, Repeat } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface Step {
  text: string;
  stepType: 'Habit' | 'Tangible';
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
  steps: Step[];
}

interface FlowCreatorProps {
  onComplete: (data: GoalData) => void;
  onCancel: () => void;
}

export function FlowCreator({ onComplete, onCancel }: FlowCreatorProps) {
  const [step, setStep] = useState<'intro' | 'name' | 'description' | 'date' | 'steps' | 'review'>('intro');
  const [direction, setDirection] = useState(0);
  const [data, setData] = useState<GoalData>({
    name: '',
    description: '',
    targetDate: addMonths(new Date(), 1),
    steps: []
  });
  const [currentStep, setCurrentStep] = useState<Step>({
    text: '',
    stepType: 'Tangible',
    tasks: []
  });
  const [error, setError] = useState<string | null>(null);

  const goToNext = () => {
    setError(null);
    const steps: Array<'intro' | 'name' | 'description' | 'date' | 'steps' | 'review'> = 
      ['intro', 'name', 'description', 'date', 'steps', 'review'];
    const currentIndex = steps.indexOf(step);
    
    // Validate current step
    if (step === 'name' && !data.name.trim()) {
      setError('Please enter a goal name');
      return;
    }
    if (step === 'description' && !data.description.trim()) {
      setError('Please enter a goal description');
      return;
    }

    if (currentIndex < steps.length - 1) {
      setDirection(1);
      setStep(steps[currentIndex + 1]);
    }
  };

  const goToPrevious = () => {
    const steps: Array<'intro' | 'name' | 'description' | 'date' | 'steps' | 'review'> = 
      ['intro', 'name', 'description', 'date', 'steps', 'review'];
    const currentIndex = steps.indexOf(step);
    
    if (currentIndex > 0) {
      setDirection(-1);
      setStep(steps[currentIndex - 1]);
    }
  };

  const addStep = () => {
    if (!currentStep.text.trim()) {
      setError('Please enter a step description');
      return;
    }
    
    setData(prev => ({
      ...prev,
      steps: [...prev.steps, currentStep]
    }));
    
    setCurrentStep({
      text: '',
      stepType: 'Tangible',
      tasks: []
    });
    setError(null);
  };

  const removeStep = (index: number) => {
    setData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const handleComplete = () => {
    if (data.steps.length === 0) {
      setError('Please add at least one step');
      return;
    }
    onComplete(data);
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

  const setStepType = (value: 'Habit' | 'Tangible') => {
    setCurrentStep(prev => ({ 
      ...prev, 
      stepType: value,
      tasks: prev.tasks || [] // Ensure tasks is always initialized
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
                  Let's Create Your Goal
                </motion.h1>
                <motion.p 
                  className="text-xl text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  We'll break it down into achievable steps
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
                    Let's Begin
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          )}

          {step === 'name' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  What's your goal?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Give your goal a clear, actionable name
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
            </div>
          )}

          {step === 'description' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Describe your goal
                </h2>
                <p className="text-xl text-muted-foreground">
                  What does success look like?
                </p>
              </div>

              <Card className="p-6">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter your goal description..."
                    value={data.description}
                    onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[150px] text-lg"
                  />
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {step === 'date' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  When do you want to achieve this?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Set a target date for your goal
                </p>
              </div>

              <Card className="p-6">
                <div className="flex justify-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[280px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(data.targetDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={data.targetDate}
                        onSelect={(date) => date && setData(prev => ({ ...prev, targetDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </Card>
            </div>
          )}

          {step === 'steps' && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Break it down
                </h2>
                <p className="text-xl text-muted-foreground">
                  What steps will help you achieve this goal?
                </p>
              </div>

              <Card className="p-6">
                <div className="space-y-6">
                  {/* Current steps */}
                  {data.steps.length > 0 && (
                    <div className="space-y-4">
                      {data.steps.map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-4 rounded-lg border"
                        >
                          <div>
                            <p className="font-medium">{step.text}</p>
                            <p className="text-sm text-muted-foreground">
                              {step.stepType}
                              {step.stepType === 'Habit' && step.frequency && 
                                ` - ${step.frequency}x per ${step.frequencyType || 'week'}`}
                              {step.stepType === 'Tangible' && step.targetDate && 
                                ` - Due ${format(step.targetDate, 'PP')}`}
                              {data.targetDate && 
                                ` - Target completion: ${format(data.targetDate, 'PP')}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStep(index)}
                          >
                            Remove
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Add new step */}
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Input
                        placeholder="Enter a step..."
                        value={currentStep.text}
                        onChange={(e) => setCurrentStep(prev => ({ ...prev, text: e.target.value }))}
                      />
                      <Select
                        value={currentStep.stepType}
                        onValueChange={setStepType}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Step type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Habit">
                            <div className="flex items-center">
                              <Repeat className="w-4 h-4 mr-2" />
                              Habit
                            </div>
                          </SelectItem>
                          <SelectItem value="Tangible">
                            <div className="flex items-center">
                              <Target className="w-4 h-4 mr-2" />
                              Tangible
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {currentStep.stepType === 'Habit' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Frequency"
                            value={currentStep.frequency || ''}
                            onChange={(e) => setCurrentStep(prev => ({ 
                              ...prev, 
                              frequency: parseInt(e.target.value) || undefined 
                            }))}
                            className="w-[150px]"
                          />
                          <span className="text-muted-foreground">times per</span>
                          <Select
                            value={currentStep.frequencyType || 'week'}
                            onValueChange={(value: 'week' | 'month' | 'quarter' | 'year') => 
                              setCurrentStep(prev => ({ ...prev, frequencyType: value }))
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="week">Week</SelectItem>
                              <SelectItem value="month">Month</SelectItem>
                              <SelectItem value="quarter">Quarter</SelectItem>
                              <SelectItem value="year">Year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {currentStep.frequency && currentStep.frequencyType && `That's about ${
                            currentStep.frequencyType === 'week' ? currentStep.frequency :
                            currentStep.frequencyType === 'month' ? Math.round(currentStep.frequency / 4.33) :
                            currentStep.frequencyType === 'quarter' ? Math.round(currentStep.frequency / 13) :
                            Math.round(currentStep.frequency / 52)
                          } times per week`}
                        </p>
                      </div>
                    )}

                    {currentStep.stepType === 'Tangible' && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {currentStep.targetDate ? 
                              format(currentStep.targetDate, 'PPP') : 
                              'Select target date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={currentStep.targetDate}
                            onSelect={(date) => date && setCurrentStep(prev => ({ 
                              ...prev, 
                              targetDate: date 
                            }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}

                    {/* Add notes and tasks */}
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Add notes about this step (optional)..."
                        value={currentStep.notes || ''}
                        onChange={(e) => setCurrentStep(prev => ({ 
                          ...prev, 
                          notes: e.target.value 
                        }))}
                        className="h-20"
                      />
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Tasks</p>
                        {(currentStep.tasks || []).map((task, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={task.text}
                              onChange={(e) => {
                                const newTasks = [...(currentStep.tasks || [])];
                                newTasks[index] = { ...task, text: e.target.value };
                                setCurrentStep(prev => ({ ...prev, tasks: newTasks }));
                              }}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newTasks = [...(currentStep.tasks || [])];
                                newTasks.splice(index, 1);
                                setCurrentStep(prev => ({ ...prev, tasks: newTasks }));
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newTasks = [...(currentStep.tasks || []), { text: '', isCompleted: false }];
                            setCurrentStep(prev => ({ ...prev, tasks: newTasks }));
                          }}
                          className="w-full"
                        >
                          Add Task
                        </Button>
                      </div>
                    </div>

                    <Button 
                      onClick={() => {
                        if (!currentStep.tasks) {
                          currentStep.tasks = [];
                        }
                        addStep();
                      }}
                      className="w-full"
                    >
                      Add Step
                    </Button>

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                  </div>
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
                  Make sure everything looks right
                </p>
              </div>

              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">{data.name}</h3>
                  <p className="text-muted-foreground mt-1">{data.description}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Target Date: {format(data.targetDate, 'PPP')}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Steps:</h4>
                  {data.steps.map((step, index) => (
                    <div 
                      key={index}
                      className="p-4 rounded-lg border space-y-2"
                    >
                      <p className="font-medium">{step.text}</p>
                      <p className="text-sm text-muted-foreground">
                        {step.stepType}
                        {step.stepType === 'Habit' && step.frequency && 
                          ` - ${step.frequency}x per ${step.frequencyType || 'week'}`}
                        {step.stepType === 'Tangible' && step.targetDate && 
                          ` - Due ${format(step.targetDate, 'PP')}`}
                        {data.targetDate && 
                          ` - Target completion: ${format(data.targetDate, 'PP')}`}
                      </p>
                      {step.notes && (
                        <p className="text-sm italic text-muted-foreground">
                          {step.notes}
                        </p>
                      )}
                      {step.tasks && step.tasks.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Tasks:</p>
                          <ul className="text-sm list-disc list-inside">
                            {step.tasks.map((task, taskIndex) => (
                              <li key={taskIndex}>{task.text}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
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
                onClick={handleComplete}
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