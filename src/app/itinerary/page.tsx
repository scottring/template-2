'use client';

import { useState } from 'react';
import { ItineraryView } from '@/components/itinerary/ItineraryView';
import { ItineraryGenerator } from '@/components/itinerary/ItineraryGenerator';
import type { TimeScale, ItineraryType } from '@/types/models';
import { format } from 'date-fns';

export default function ItineraryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState<ItineraryType>('planning');
  const [selectedTimeScale, setSelectedTimeScale] = useState<TimeScale>('daily');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Itinerary</h1>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="rounded-md border-gray-300"
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ItineraryType)}
              className="rounded-md border-gray-300"
            >
              <option value="planning">Planning</option>
              <option value="review">Review</option>
            </select>
            <select
              value={selectedTimeScale}
              onChange={(e) => setSelectedTimeScale(e.target.value as TimeScale)}
              className="rounded-md border-gray-300"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <ItineraryGenerator
          date={selectedDate}
          type={selectedType}
          timeScale={selectedTimeScale}
        />
        
        <ItineraryView
          date={selectedDate}
          type={selectedType}
          timeScale={selectedTimeScale}
        />
      </div>
    </div>
  );
} 