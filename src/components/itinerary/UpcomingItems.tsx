'use client';

import { format, endOfWeek } from 'date-fns';
import useItineraryStore from '@/lib/stores/useItineraryStore';

interface UpcomingItemsProps {
  date: Date;
}

export function UpcomingItems({ date }: UpcomingItemsProps) {
  const { getUpcomingItems } = useItineraryStore();
  const items = getUpcomingItems(date, endOfWeek(date));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Coming Up This Week</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div 
            key={item.id}
            className="p-3 rounded-md hover:bg-gray-50"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-medium">{item.notes}</span>
                {item.referenceId && (
                  <p className="text-sm text-gray-500">
                    From: {item.referenceId}
                  </p>
                )}
              </div>
              {item.dueDate && (
                <span className="text-sm text-gray-500">
                  {format(item.dueDate, 'E, MMM d')}
                </span>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-gray-500 text-sm">
            No upcoming items for this week
          </p>
        )}
      </div>
    </div>
  );
} 