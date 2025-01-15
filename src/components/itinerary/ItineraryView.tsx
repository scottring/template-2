'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useItineraryStore from '@/lib/stores/useItineraryStore';
import useGoalStore from '@/lib/stores/useGoalStore';
import type { ItineraryItem, TimeScale } from '@/types/models';
import { format } from 'date-fns';

interface ItineraryViewProps {
  date: Date;
  type: 'planning' | 'review';
  timeScale: TimeScale;
}

export function ItineraryView({ date, type, timeScale }: ItineraryViewProps) {
  const router = useRouter();
  const { getTodayItems, updateItem } = useItineraryStore();
  const { goals } = useGoalStore();
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [goalMap, setGoalMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const currentItems = getTodayItems(date);
    setItems(currentItems);
    
    // Create mapping of goal IDs to goal names
    const newGoalMap: Record<string, string> = {};
    goals.forEach(goal => {
      newGoalMap[goal.id] = goal.name;
    });
    setGoalMap(newGoalMap);
  }, [date, getTodayItems, goals]);

  if (!items.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No items found for this date.</p>
      </div>
    );
  }

  const handleStatusChange = (itemId: string, status: ItineraryItem['status']) => {
    updateItem(itemId, { status });
  };

  const handleItemClick = (item: ItineraryItem) => {
    router.push(`/itinerary/${item.referenceId}`);
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
        {items.map((item: ItineraryItem) => (
          <div 
            key={item.id} 
            className="py-4 cursor-pointer hover:bg-gray-50"
            onClick={() => handleItemClick(item)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-gray-900">{item.type}</span>
                <span className="text-gray-500">{item.notes}</span>
              </div>
              <select
                value={item.status}
                onChange={(e) => handleStatusChange(item.id, e.target.value as ItineraryItem['status'])}
                className="rounded-md border-gray-300 text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
