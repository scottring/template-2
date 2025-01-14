'use client';

import { useEffect, useState } from 'react';
import { useItineraryStore } from '@/lib/stores/useItineraryStore';
import type { Itinerary, ItineraryItem, TimeScale, ItineraryType } from '@/types/models';
import { format } from 'date-fns';

interface ItineraryViewProps {
  date: Date;
  type: ItineraryType;
  timeScale: TimeScale;
}

export function ItineraryView({ date, type, timeScale }: ItineraryViewProps) {
  const { getItineraryByDate, updateItemStatus } = useItineraryStore();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    const currentItinerary = getItineraryByDate(date, type, timeScale);
    setItinerary(currentItinerary);
  }, [date, type, timeScale, getItineraryByDate]);

  if (!itinerary) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No itinerary found for this date.</p>
      </div>
    );
  }

  const handleStatusChange = async (itemId: string, status: ItineraryItem['status']) => {
    if (!itinerary) return;
    await updateItemStatus(itinerary.id, itemId, status);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">
          {type === 'planning' ? 'Planning' : 'Review'} - {timeScale}
        </h2>
        <p className="text-gray-500">{format(date, 'PPPP')}</p>
      </div>

      <div className="divide-y divide-gray-200">
        {itinerary.items.map((item) => (
          <div key={item.id} className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-gray-900">{item.type}</span>
                <span className="text-gray-500">{item.notes}</span>
              </div>
              <select
                value={item.status}
                onChange={(e) => handleStatusChange(item.id, e.target.value as ItineraryItem['status'])}
                className="rounded-md border-gray-300 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="deferred">Deferred</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 