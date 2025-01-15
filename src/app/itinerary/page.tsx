'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { TodaySchedule } from '@/components/itinerary/TodaySchedule';
import { ActiveHabits } from '@/components/itinerary/ActiveHabits';
import { UpcomingItems } from '@/components/itinerary/UpcomingItems';
import { NeedsAttention } from '@/components/itinerary/NeedsAttention';

export default function ItineraryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Itinerary</h1>
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="rounded-md border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <TodaySchedule date={selectedDate} />
          <UpcomingItems date={selectedDate} />
        </div>
        <div className="space-y-8">
          <ActiveHabits />
          <NeedsAttention />
        </div>
      </div>
    </div>
  );
} 