'use client';

import { useEffect } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Circle } from 'lucide-react';
import useItineraryStore from '@/lib/stores/useItineraryStore';

interface TodayScheduleProps {
  date: Date;
}

export function TodaySchedule({ date }: TodayScheduleProps) {
  const { getTodayItems, completeItem, getStreak } = useItineraryStore();
  const items = getTodayItems(date);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">
        Today's Schedule ({format(date, 'MMM d')})
      </h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-50"
          >
            <button 
              className="mt-1 text-gray-400 hover:text-green-500"
              onClick={() => completeItem(item.id, item.status !== 'completed')}
            >
              {item.status === 'completed' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {item.dueDate && (
                  <span className="text-sm text-gray-500">
                    {format(item.dueDate, 'HH:mm')}
                  </span>
                )}
                <span className="font-medium">{item.notes}</span>
                {item.type === 'habit' && (
                  <span className="text-sm text-orange-500">
                    🔥 {getStreak(item.id)} days
                  </span>
                )}
              </div>
              {item.referenceId && (
                <p className="text-sm text-gray-500">
                  Part of: {item.referenceId}
                </p>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-gray-500 text-sm">
            No items scheduled for today
          </p>
        )}
      </div>
    </div>
  );
} 