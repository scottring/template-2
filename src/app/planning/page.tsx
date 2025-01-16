'use client';

import { useRouter } from "next/navigation";
import { useJourneyStore } from "@/lib/stores/useJourneyStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format, subWeeks, startOfWeek } from "date-fns";

export default function PlanningPage() {
  const router = useRouter();
  const { startPlanning } = useJourneyStore();
  const [selectedDate, setSelectedDate] = useState<string>("");

  const handleStartPlanning = () => {
    let planningDate;
    if (selectedDate) {
      planningDate = startOfWeek(new Date(selectedDate));
    }
    startPlanning(planningDate);
    router.push('/planning/review-goals');
  };

  // Calculate date for 1 week ago as default
  const defaultDate = format(subWeeks(new Date(), 1), 'yyyy-MM-dd');

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Planning & Review</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Start Weekly Planning</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="planningDate" className="block text-sm font-medium text-gray-700 mb-1">
                Planning Week Start Date (optional)
              </label>
              <Input
                type="date"
                id="planningDate"
                defaultValue={defaultDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave empty to use the default planning schedule
              </p>
            </div>
            <Button onClick={handleStartPlanning} className="w-full">
              Start Weekly Planning
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Planning Schedule</h2>
          <p className="text-gray-600">
            Configure your regular planning schedule and preferences.
          </p>
          {/* Add planning schedule configuration UI here */}
        </Card>
      </div>
    </div>
  );
} 