'use client';

import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import useItineraryStore from '@/lib/stores/useItineraryStore';

export function NeedsAttention() {
  const { getNeedsAttention, getProgress, getStreak } = useItineraryStore();
  const items = getNeedsAttention();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-semibold">Needs Attention</h2>
      </div>
      
      <div className="space-y-4">
        {items.map((item) => {
          const progress = getProgress(item.id);
          const streak = getStreak(item.id);
          const lastActivity = progress?.lastUpdatedAt;

          return (
            <div
              key={item.id}
              className="p-3 rounded-md bg-amber-50 border border-amber-100"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-medium">{item.notes}</span>
                  <p className="text-sm text-amber-700 mt-1">
                    {streak === 0 && lastActivity
                      ? `Streak broken ${format(lastActivity, 'MMM d')}`
                      : progress && progress.completed < progress.total
                      ? `Behind schedule: ${progress.completed}/${progress.total} completed`
                      : 'At risk'}
                  </p>
                </div>
              </div>

              {progress && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm text-amber-700 mb-1">
                    <span>Progress</span>
                    <span>{progress.completed}/{progress.total}</span>
                  </div>
                  <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(progress.completed / progress.total) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {lastActivity && (
                <p className="text-sm text-amber-700 mt-2">
                  Last activity: {format(lastActivity, 'MMM d')}
                </p>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <p className="text-gray-500 text-sm">
            No items need attention right now
          </p>
        )}
      </div>
    </div>
  );
} 