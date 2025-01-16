"use client";

import { useRouter } from "next/navigation";
import { useJourneyStore } from "@/lib/stores/useJourneyStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function MarkItemsPage() {
  const router = useRouter();
  const { nextPlanningStep } = useJourneyStore();

  const handleNext = () => {
    nextPlanningStep();
    router.push("/planning/schedule");
  };

  const handleBack = () => {
    router.push("/planning/review-goals");
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mark Items for Scheduling</h1>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext}>
            Next Step
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Success Criteria Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold">Success Criteria</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Select which success criteria need to be scheduled for this week.
          </p>
          <div className="space-y-4">
            {/* Success criteria list will go here */}
            <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <Checkbox id="criteria-1" />
              <div className="space-y-1">
                <label
                  htmlFor="criteria-1"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Example Success Criteria
                </label>
                <p className="text-sm text-gray-500">
                  Description of the success criteria and its requirements
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tasks Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Tasks</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Select which tasks need to be scheduled for this week.
          </p>
          <div className="space-y-4">
            {/* Tasks list will go here */}
            <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <Checkbox id="task-1" />
              <div className="space-y-1">
                <label
                  htmlFor="task-1"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Example Task
                </label>
                <p className="text-sm text-gray-500">
                  Description of the task and its requirements
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 