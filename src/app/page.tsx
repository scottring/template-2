'use client';

import { useState, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGoalStore } from '@/lib/stores/useGoalStore';
import { useAreaStore } from '@/lib/stores/useAreaStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Target,
  Compass,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Plus,
  LayoutDashboard,
} from 'lucide-react';
import { Area, Goal, SuccessCriteria, TimeScale } from '@/types/models';

interface SuccessCriteriaInput extends Omit<SuccessCriteria, 'text'> {
  text: string;
  isTracked: boolean;
  timescale?: TimeScale;
  frequency?: number;
}

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Welcome to Symphony Planner",
    description: "Let's orchestrate your life's goals into a beautiful symphony of achievement. We'll start by creating your first life area - a key domain you want to focus on.",
    icon: Compass,
    action: "Create Your First Area"
  },
  {
    id: 2,
    title: "Set Your First Goal",
    description: "Now that we have an area defined, let's create a meaningful goal within it. What would you like to achieve?",
    icon: Target,
    action: "Add a Goal"
  },
  {
    id: 3,
    title: "Define Success",
    description: "Great! Let's break down what success looks like. What specific criteria will tell you you've achieved this goal?",
    icon: CheckCircle2,
    action: "Add Success Criteria"
  },
  {
    id: 4,
    title: "Your Daily Symphony",
    description: "We'll transform your goals into daily actions. Your personalized itinerary will show you exactly what to focus on each day.",
    icon: Calendar,
    action: "View Your Itinerary"
  }
];

export default function Dashboard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [areaName, setAreaName] = useState('');
  const [areaDescription, setAreaDescription] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [successCriteria, setSuccessCriteria] = useState<SuccessCriteriaInput[]>([{
    text: '',
    isTracked: false,
    timescale: undefined,
    frequency: undefined
  }]);
  const { addArea } = useAreaStore();
  const { addGoal } = useGoalStore();

  const handleAddArea = async () => {
    if (areaName) {
      const area: Omit<Area, 'id'> = {
        name: areaName,
        description: areaDescription,
        isActive: true,
        isFocus: false,
        assignedTo: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await addArea(area);
      setCurrentStep(2);
    }
  };

  const handleAddGoal = async () => {
    if (goalTitle) {
      const goal: Omit<Goal, 'id'> = {
        name: goalTitle,
        description: goalDescription,
        areaId: '', // This should be set from the area we just created
        startDate: new Date(),
        targetDate: new Date(),
        progress: 0,
        assignedTo: [],
        successCriteria: successCriteria.filter(c => c.text !== ''),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await addGoal(goal);
      setCurrentStep(3);
    }
  };

  const handleAddCriteria = () => {
    setSuccessCriteria([...successCriteria, {
      text: '',
      isTracked: false,
      timescale: undefined,
      frequency: undefined
    }]);
  };

  const handleUpdateCriteria = (index: number, updates: Partial<SuccessCriteriaInput>) => {
    const newCriteria = [...successCriteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };
    setSuccessCriteria(newCriteria);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setter: (value: string) => void) => {
    setter(e.target.value);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Input
              placeholder="Area Name (e.g., Health & Fitness)"
              value={areaName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(e, setAreaName)}
            />
            <Input
              placeholder="What does this area mean to you? Why is it important?"
              value={areaDescription}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(e, setAreaDescription)}
            />
            <Button onClick={handleAddArea} disabled={!areaName}>
              Create Area
            </Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <Input
              placeholder="Goal Title"
              value={goalTitle}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(e, setGoalTitle)}
            />
            <Input
              placeholder="What do you want to achieve? Be specific."
              value={goalDescription}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(e, setGoalDescription)}
            />
            <Button onClick={handleAddGoal} disabled={!goalTitle}>
              Set Goal
            </Button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            {successCriteria.map((criteria, index) => (
              <div key={index} className="space-y-2">
                <input
                  type="text"
                  placeholder="How will you know you've succeeded?"
                  value={criteria.text}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateCriteria(index, { text: e.target.value })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={criteria.isTracked}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateCriteria(index, { isTracked: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    />
                    Track in itinerary
                  </label>
                  {criteria.isTracked && (
                    <>
                      <select
                        value={criteria.timescale || ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => handleUpdateCriteria(index, { timescale: e.target.value as TimeScale })}
                        className="rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      >
                        <option value="">Select frequency</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                      {criteria.timescale && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={criteria.frequency || ''}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateCriteria(index, { frequency: parseInt(e.target.value) })}
                            className="w-16 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                          />
                          <span className="text-sm text-gray-600">times {criteria.timescale}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={handleAddCriteria}>
              <Plus className="w-4 h-4 mr-2" />
              Add Another Criterion
            </Button>
            <Button 
              onClick={() => setCurrentStep(4)} 
              disabled={!successCriteria[0].text}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-gray-600">
              Congratulations! You've set up your first goal and success criteria. 
              Now let's see how Symphony Planner helps you achieve it.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => router.push('/itinerary')}>
                View Itinerary
              </Button>
              <Button variant="outline" onClick={() => router.push('/goals')}>
                View Goals
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                step.id === currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                step.id === currentStep ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <step.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">{steps[currentStep - 1].title}</h2>
              <p className="text-gray-600 mb-6">{steps[currentStep - 1].description}</p>
              {renderStepContent()}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
