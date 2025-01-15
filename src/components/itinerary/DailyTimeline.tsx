'use client';

import { useState } from 'react';
import { ItineraryItem } from '@/types/models';

interface TimeBlock {
  startTime: string;
  endTime: string;
  items: ItineraryItem[];
}

interface DailyTimelineProps {
  date: Date;
  unassignedItems: ItineraryItem[];
  onAssignItem: (itemId: string, startTime: string) => void;
}

export function DailyTimeline({ date, unassignedItems, onAssignItem }: DailyTimelineProps) {
  // Generate time blocks from 4am to 10pm in 30-minute intervals
  const generateTimeBlocks = () => {
    const blocks: TimeBlock[] = [];
    const startHour = 4;
    const endHour = 22;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinute = minute + 30;
        const endHour = endMinute === 60 ? hour + 1 : hour;
        const endTime = `${endHour.toString().padStart(2, '0')}:${(endMinute % 60).toString().padStart(2, '0')}`;
        
        blocks.push({
          startTime,
          endTime,
          items: [],
        });
      }
    }

    return blocks;
  };

  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(generateTimeBlocks());
  const [draggingItem, setDraggingItem] = useState<ItineraryItem | null>(null);

  const handleDragStart = (item: ItineraryItem) => {
    setDraggingItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (startTime: string) => {
    if (draggingItem) {
      onAssignItem(draggingItem.id, startTime);
      setDraggingItem(null);
    }
  };

  return (
    <div className="flex gap-x-4">
      {/* Timeline */}
      <div className="flex-1 space-y-2">
        {timeBlocks.map((block) => (
          <div
            key={block.startTime}
            className="flex items-center gap-x-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(block.startTime)}
          >
            <div className="w-20 text-sm text-gray-500">
              {block.startTime} - {block.endTime}
            </div>
            <div className="flex-1 min-h-[2rem] bg-gray-50 rounded border border-dashed border-gray-300">
              {block.items.map((item) => (
                <div key={item.id} className="p-2 text-sm">
                  {item.type}: {item.id}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Unassigned Items */}
      <div className="w-64 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Unassigned Items</h3>
        <div className="space-y-2">
          {unassignedItems.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(item)}
              className="p-2 bg-white rounded border border-gray-200 shadow-sm cursor-move hover:border-blue-500"
            >
              <div className="text-sm font-medium">{item.type}</div>
              <div className="text-xs text-gray-500">{item.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 