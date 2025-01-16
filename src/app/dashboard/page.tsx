'use client';

import { JourneyTimeline } from "@/components/journey/JourneyTimeline";
import { StartPlanningButton } from "@/components/planning/StartPlanningButton";
import { useJourneyStore } from "@/lib/stores/useJourneyStore";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  const { stageIndex, startPlanning, timeScale } = useJourneyStore();

  const handleStartPlanning = () => {
    startPlanning(timeScale);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Journey Timeline Section */}
      <section>
        <JourneyTimeline 
          currentStage={stageIndex}
          onStageClick={(index) => console.log('Stage clicked:', index)}
        />
      </section>

      {/* Start Planning Section */}
      <section className="flex justify-center py-8">
        <Card className="p-8 flex flex-col items-center space-y-4 max-w-2xl w-full">
          <h2 className="text-2xl font-bold text-gray-900">Ready to Plan?</h2>
          <p className="text-gray-600 text-center mb-4">
            Start your {timeScale}ly planning session to organize goals, distribute tasks, and align your household's vision.
          </p>
          <StartPlanningButton 
            onClick={handleStartPlanning}
            timeScale={timeScale}
          />
        </Card>
      </section>

      {/* Other dashboard content can go here */}
    </div>
  );
} 