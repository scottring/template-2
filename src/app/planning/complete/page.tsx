"use client";

import { useRouter } from "next/navigation";
import { useJourneyStore } from "@/lib/stores/useJourneyStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, ChevronRight, ListChecks } from "lucide-react";

export default function CompletePlanningPage() {
  const router = useRouter();
  const { completePlanning, getEffectivePlanningStartDate } = useJourneyStore();
  const startDate = getEffectivePlanningStartDate();

  const handleComplete = () => {
    completePlanning();
    router.push("/dashboard");
  };

  const handleBack = () => {
    router.push("/planning/schedule");
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Complete Planning Session</h1>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Schedule
        </Button>
      </div>

      <Card className="p-8 max-w-2xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <ListChecks className="h-6 w-6 text-green-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Ready to Start Your Week?</h2>
            <p className="text-gray-600">
              You've completed your planning session. All tasks are distributed and schedules are set.
              Your week will start from {startDate.toLocaleDateString()}.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-sm">
            <Button 
              variant="outline" 
              className="border-2 border-green-600 text-green-600 hover:bg-green-50"
              onClick={handleComplete}
            >
              <Check className="mr-2 h-5 w-5" />
              Close Meeting
            </Button>
            
            <Button 
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              onClick={handleComplete}
            >
              <span className="text-lg">Start Week</span>
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="pt-6 border-t w-full">
            <h3 className="font-medium mb-2">Quick Summary</h3>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>• Goals reviewed and adjusted</li>
              <li>• Success criteria scheduled</li>
              <li>• Tasks distributed</li>
              <li>• Weekly schedule prepared</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
} 