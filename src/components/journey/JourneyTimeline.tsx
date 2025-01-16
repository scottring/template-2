"use client";

import { cn } from "@/lib/utils";
import { Target, CalendarDays, Home, LineChart, Brain } from "lucide-react";
import { motion } from "framer-motion";

interface TimelineStage {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const stages: TimelineStage[] = [
  {
    name: "Base Goal Setting",
    description: "Vision and members",
    icon: Target,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    name: "Review & Planning",
    description: "Task distribution",
    icon: CalendarDays,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    name: "Daily Life",
    description: "Task execution",
    icon: Home,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    name: "Progress Tracking",
    description: "Monitor goals",
    icon: LineChart,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  {
    name: "Reflection",
    description: "Review and adjust",
    icon: Brain,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
];

interface JourneyTimelineProps {
  currentStage: number;
  onStageClick?: (index: number) => void;
}

export function JourneyTimeline({ currentStage, onStageClick }: JourneyTimelineProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Household Journey</h2>
      <p className="text-gray-600 mb-8">
        Track your household's progress through the goal achievement cycle. Each stage represents a key phase in your journey:
      </p>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2" />

        {/* Timeline stages */}
        <div className="relative flex justify-between items-center">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = index === currentStage;
            const isPast = index < currentStage;

            return (
              <motion.div
                key={stage.name}
                className="relative flex flex-col items-center"
                whileHover={{ scale: 1.05 }}
                onClick={() => onStageClick?.(index)}
              >
                {/* Stage dot */}
                <motion.div
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center cursor-pointer",
                    isActive ? stage.bgColor : isPast ? "bg-gray-200" : "bg-gray-100"
                  )}
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    opacity: isActive ? 1 : isPast ? 0.8 : 0.6,
                  }}
                >
                  <Icon className={cn("w-8 h-8", isActive ? stage.color : "text-gray-400")} />
                </motion.div>

                {/* Stage name */}
                <div className="absolute -bottom-16 w-32 text-center">
                  <p className={cn(
                    "font-semibold",
                    isActive ? stage.color : "text-gray-500"
                  )}>
                    {stage.name}
                  </p>
                  <p className="text-sm text-gray-500">{stage.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-gray-500 mt-24 text-sm">
        Click on any stage to view detailed information and actions for that phase
      </p>
    </div>
  );
} 