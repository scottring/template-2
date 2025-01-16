'use client';

import { useRouter } from "next/navigation";
import { JourneyTimeline } from "@/components/journey/JourneyTimeline";
import { StartPlanningButton } from "@/components/planning/StartPlanningButton";
import { useJourneyStore } from "@/lib/stores/useJourneyStore";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { CalendarDays, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PlanningPage() {
  const router = useRouter();
  const { 
    stageIndex, 
    startPlanning, 
    isInPlanningSessions,
    planningStep,
    getEffectivePlanningStartDate,
    shouldIncludeLargerTimeScaleGoals
  } = useJourneyStore();

  const effectiveStartDate = getEffectivePlanningStartDate();
  const { monthly, quarterly, yearly } = shouldIncludeLargerTimeScaleGoals();
  const hasLargerTimeScaleGoals = monthly || quarterly || yearly;

  const handleStartPlanning = () => {
    startPlanning();
    router.push("/planning/review-goals");
  };

  // If we're in a planning session, redirect to the appropriate step
  if (isInPlanningSessions && planningStep !== "not_started") {
    const stepRoutes = {
      review_goals: "/planning/review-goals",
      mark_for_scheduling: "/planning/mark-items",
      schedule_items: "/planning/schedule",
      complete: "/planning/complete"
    };
    
    router.push(stepRoutes[planningStep]);
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Journey Timeline */}
      <section>
        <JourneyTimeline 
          currentStage={stageIndex}
          onStageClick={(index) => console.log('Stage clicked:', index)}
        />
      </section>

      {/* Planning Controls */}
      <section className="flex justify-center py-8">
        <Card className="p-8 flex flex-col items-center space-y-6 max-w-2xl w-full">
          <h2 className="text-2xl font-bold text-gray-900">Start Weekly Planning</h2>
          
          {hasLargerTimeScaleGoals && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                {yearly ? "It's the start of a new year! " : ""}
                {quarterly ? "A new quarter is beginning! " : ""}
                {monthly ? "It's the start of a new month! " : ""}
                We'll include relevant goals in this week's planning session.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2 text-gray-600">
            <CalendarDays className="w-5 h-5" />
            <span>Planning period will start from {format(effectiveStartDate, 'MMMM d, yyyy')}</span>
          </div>

          <p className="text-gray-600 text-center">
            Start your weekly planning session to organize goals, distribute tasks, and align your household's vision.
            {hasLargerTimeScaleGoals && " We'll also review and adjust longer-term goals during this session."}
          </p>

          <StartPlanningButton 
            onClick={handleStartPlanning}
          />
        </Card>
      </section>
    </div>
  );
} 