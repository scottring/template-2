"use client";

import { useRouter } from "next/navigation";
import { useJourneyStore } from "@/lib/stores/useJourneyStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function ReviewGoalsPage() {
  const router = useRouter();
  const { nextPlanningStep, shouldIncludeLargerTimeScaleGoals } = useJourneyStore();
  const { monthly, quarterly, yearly } = shouldIncludeLargerTimeScaleGoals();

  const handleNext = () => {
    nextPlanningStep();
    router.push("/planning/mark-items");
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Review Goals</h1>
        <Button onClick={handleNext} size="lg">
          Next Step
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Special sections for larger timescale goals */}
      {yearly && (
        <Card className="p-6 mb-6 border-l-4 border-l-blue-600">
          <h2 className="text-xl font-semibold mb-4">Yearly Goals Review</h2>
          <p className="text-gray-600 mb-4">
            It&apos;s the start of a new year! Take time to review and adjust your yearly goals.
          </p>
          {/* Yearly goals list will go here */}
        </Card>
      )}

      {quarterly && (
        <Card className="p-6 mb-6 border-l-4 border-l-purple-600">
          <h2 className="text-xl font-semibold mb-4">Quarterly Goals Review</h2>
          <p className="text-gray-600 mb-4">
            A new quarter is beginning. Review your progress and set goals for the next three months.
          </p>
          {/* Quarterly goals list will go here */}
        </Card>
      )}

      {monthly && (
        <Card className="p-6 mb-6 border-l-4 border-l-green-600">
          <h2 className="text-xl font-semibold mb-4">Monthly Goals Review</h2>
          <p className="text-gray-600 mb-4">
            It&apos;s a new month! Review your monthly goals and align them with your longer-term vision.
          </p>
          {/* Monthly goals list will go here */}
        </Card>
      )}

      {/* Weekly goals section */}
      <Card className="p-6 border-l-4 border-l-yellow-600">
        <h2 className="text-xl font-semibold mb-4">Weekly Goals Review</h2>
        <p className="text-gray-600 mb-4">
          Review your goals for the week ahead and ensure they align with your broader objectives.
        </p>
        {/* Weekly goals list will go here */}
      </Card>

      <p className="text-muted-foreground">
        Let&apos;s review your goals and progress.
      </p>
    </div>
  );
} 