import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Target,
  CalendarDays,
  ClipboardList,
  CalendarRange,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  LineChart,
  CheckCircle2,
  X
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to Symphony",
    description: "Your personal goal orchestrator that helps you achieve more through mindful planning and reflection.",
    icon: Sparkles,
    color: "from-violet-500 to-purple-500"
  },
  {
    title: "Set Meaningful Goals",
    description: "Break down your aspirations into achievable goals with clear steps and habits that lead to success.",
    icon: Target,
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Plan with Purpose",
    description: "Schedule your tasks and habits strategically, ensuring steady progress towards your goals.",
    icon: CalendarDays,
    color: "from-emerald-500 to-teal-500"
  },
  {
    title: "Track Your Journey",
    description: "Monitor your daily progress, celebrate wins, and stay motivated with visual progress tracking.",
    icon: ClipboardList,
    color: "from-orange-500 to-amber-500"
  },
  {
    title: "Learn & Adapt",
    description: "Review your performance, identify patterns, and adjust your approach for continuous improvement.",
    icon: LineChart,
    color: "from-rose-500 to-pink-500"
  },
  {
    title: "Ready to Begin?",
    description: "Start your journey to achieving your goals with Symphony's guided approach.",
    icon: CheckCircle2,
    color: "from-green-500 to-emerald-500"
  }
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const goToNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
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

  const Step = ({ step, index }: { step: typeof steps[0], index: number }) => {
    const Icon = step.icon;
    const isLast = index === steps.length - 1;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`p-6 rounded-full bg-gradient-to-br ${step.color} shadow-lg mb-8`}
        >
          <Icon className="h-12 w-12 text-white" />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-200 mb-4"
        >
          {step.title}
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-center text-muted-foreground mb-8"
        >
          {step.description}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4"
        >
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={goToNext}>
            {isLast ? "Get Started" : "Continue"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex items-center gap-2"
        >
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? `w-8 bg-gradient-to-r ${step.color}`
                  : 'w-2 bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <Card className="relative max-w-4xl w-full mx-4 p-8 shadow-lg">
          <button
            onClick={onComplete}
            className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="w-full"
            >
              <Step step={steps[currentStep]} index={currentStep} />
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
} 